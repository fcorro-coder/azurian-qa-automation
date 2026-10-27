import { expect, type Locator, type Page } from "@playwright/test";
import type { DocumentFixture } from "../types/documents";
import { OBSERVACIONES_PRUEBA } from "../fixtures/test-data";

const CREATE_PATH = "/api/documents";

// ── POST request tracker (module-level WeakMap keyed by Page) ──────────────
// State is keyed by the Playwright Page object so that EVERY DocumentFormPage
// instance created within the same scenario (and thus sharing the same page)
// observes the same captured POSTs. This eliminates the false positive that
// occurred when instance-level properties were used: each new DocumentFormPage
// started with an empty array, causing expectNoCreationRequest() to always pass.
interface PostTrackerState {
  urls: string[];
  tracker: ((request: { method(): string; url(): string }) => void) | null;
}

const POST_TRACKERS = new WeakMap<Page, PostTrackerState>();

function getPostTracker(page: Page): PostTrackerState {
  let state = POST_TRACKERS.get(page);
  if (!state) {
    state = { urls: [], tracker: null };
    POST_TRACKERS.set(page, state);
  }
  return state;
}

import { UI_NETWORK_TIMEOUT_MS } from "../config/timeouts";

/** Formulario de emisión de documentos con localizadores y esperas centralizados. */
export class DocumentFormPage {
  readonly createDialog: Locator;

  constructor(private readonly page: Page) {
    this.createDialog = page.getByRole("dialog", { name: "Emitir nuevo documento" });
  }

  async openCreateForm(): Promise<void> {
    await this.page.getByRole("button", { name: "Nuevo documento" }).click();

    await expect(this.createDialog).toBeVisible();
    await expect(
      this.createDialog.getByRole("heading", { name: "Emitir nuevo documento" })
    ).toBeVisible();
  }

  async validateCreateForm(): Promise<void> {
    const dialog = this.createDialog;

    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Tipo de documento tributario")).toBeVisible();
    await expect(dialog.getByRole("textbox", { name: "Fecha de emisión *" })).toBeVisible();
    await expect(dialog.getByRole("spinbutton", { name: "Número de folio *" })).toBeVisible();
    await expect(dialog.getByRole("textbox", { name: "RUT receptor *" })).toBeVisible();
    await expect(dialog.getByRole("spinbutton", { name: "Monto total (CLP) *" })).toBeVisible();
    await expect(dialog.getByRole("group", { name: "Canal de entrega" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Guardar y emitir" })).toBeVisible();
  }

  /** Completa el formulario con los datos del escenario: sin valores fijos aquí. */
  async fillValidDocument(fixture: DocumentFixture): Promise<void> {
    const dialog = this.createDialog;

    await dialog.getByLabel("Tipo de documento tributario").selectOption({ value: fixture.tipoDte });

    await dialog.getByRole("spinbutton", { name: "Número de folio *" }).fill(String(fixture.folio));

    await dialog.getByRole("textbox", { name: "RUT receptor *" }).fill(fixture.rutReceptor);

    await dialog.getByRole("spinbutton", { name: "Monto total (CLP) *" }).fill(String(fixture.monto));

    await dialog.getByRole("textbox", { name: "Observaciones" }).fill(OBSERVACIONES_PRUEBA);
  }

  /**
   * Guarda el documento y espera la respuesta del POST antes de comprobar que el
   * diálogo se cerró, de modo que la comprobación nunca corre contra un envío en curso.
   */
  async saveDocument(): Promise<void> {
    const dialog = this.createDialog;

    const [response] = await Promise.all([
      this.page.waitForResponse(
        (candidate) =>
          candidate.request().method() === "POST" && new URL(candidate.url()).pathname === CREATE_PATH,
        { timeout: UI_NETWORK_TIMEOUT_MS }
      ),
      dialog.getByRole("button", { name: "Guardar y emitir" }).click()
    ]);

    expect(response.status(), "La creación del documento debió responder 201").toBe(201);
    await expect(dialog).toBeHidden();
  }

  /**
   * Envía el formulario sin esperar la respuesta del POST: para validaciones negativas
   * la UI no debe intentar crear. Registra previamente el monitoreo de solicitudes POST
   * antes de hacer clic en Guardar, de modo que cualquier solicitud — incluso si se
   * resuelve antes de la verificación — es capturada por el listener.
   */
  async attemptSubmit(): Promise<void> {
    this.setupPostTracking();
    await this.createDialog.getByRole("button", { name: "Guardar y emitir" }).click();
  }

  /** Rellena el RUT receptor con un valor arbitrario (sobrescribe el valor previo). */
  async fillRut(rut: string): Promise<void> {
    await this.createDialog.getByRole("textbox", { name: "RUT receptor *" }).fill(rut);
  }

  /** Rellena el folio con un valor arbitrario (sobrescribe el valor previo). */
  async fillFolio(folio: string): Promise<void> {
    await this.createDialog.getByRole("spinbutton", { name: "Número de folio *" }).fill(folio);
  }

  /** Rellena el monto total con un valor arbitrario (sobrescribe el valor previo). */
  async fillMonto(monto: string): Promise<void> {
    await this.createDialog.getByRole("spinbutton", { name: "Monto total (CLP) *" }).fill(monto);
  }

  /** Rellena las observaciones (sobrescribe el valor previo). */
  async fillObservaciones(texto: string): Promise<void> {
    await this.createDialog.getByRole("textbox", { name: "Observaciones" }).fill(texto);
  }

  /** Verifica que el textarea de observaciones respeta el maxLength del laboratorio. */
  async expectObservacionesMaxLength(max: number): Promise<void> {
    const textarea = this.createDialog.getByRole("textbox", { name: "Observaciones" });
    await expect(textarea, "El campo debe tener el atributo maxlength").toHaveAttribute(
      "maxlength",
      String(max)
    );
    const value = await textarea.inputValue();
    expect(
      value.length,
      `Se esperaba como máximo ${max} caracteres, pero el campo tiene ${value.length}`
    ).toBeLessThanOrEqual(max);
  }

  /** Selecciona el canal de entrega: PORTAL o EMAIL. */
  async selectDeliveryChannel(channel: "PORTAL" | "EMAIL"): Promise<void> {
    const label = channel === "PORTAL" ? "Portal" : "Correo electrónico";
    await this.createDialog.getByRole("radio", { name: label, exact: true }).check();
  }

  /** Marca la casilla de enviar copia al contacto. */
  async toggleSendCopy(): Promise<void> {
    await this.createDialog.getByRole("checkbox", { name: /Enviar copia/i }).check();
  }

  /** Rellena el correo de contacto (requiere que el campo esté habilitado). */
  async fillContactEmail(email: string): Promise<void> {
    await this.createDialog.getByLabel("Correo de contacto").fill(email);
  }

  /** Adjunta un archivo al formulario (usado para validar extensiones rechazadas). */
  async uploadFile(filePath: string): Promise<void> {
    await this.createDialog.getByLabel("Documento de respaldo").setInputFiles(filePath);
  }

  /** Verifica que el diálogo del formulario sigue visible (validación fallida sin cierre). */
  async expectFormOpen(): Promise<void> {
    await expect(this.createDialog, "El formulario debe permanecer abierto").toBeVisible();
  }

  /** Cierra el diálogo del formulario sin enviar. */
  async closeForm(): Promise<void> {
    await this.createDialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(this.createDialog, "El formulario debe cerrarse").toBeHidden();
  }

  // ── POST tracking (shared via module-level WeakMap keyed by Page) ────────

  /**
   * Registers a request listener BEFORE clicking Save so that any POST
   * fired — even one that resolves before verification — is captured.
   * State lives at module level keyed by Page so every DocumentFormPage
   * instance sharing the same page sees the same monitor.
   */
  setupPostTracking(): void {
    const state = getPostTracker(this.page);
    if (state.tracker) {
      this.page.removeListener("request", state.tracker);
    }
    state.urls = [];
    state.tracker = (request) => {
      if (request.method() === "POST") {
        const pathname = new URL(request.url()).pathname;
        if (pathname === CREATE_PATH) {
          state.urls.push(pathname);
        }
      }
    };
    this.page.on("request", state.tracker);
  }

  /**
   * Verifies no creation POST was emitted. Combines two evidence sources:
   * 1. Requests captured by the listener registered before the click.
   * 2. A 500 ms backstop window for late responses.
   * Cleans up the listener after verification.
   */
  async expectNoCreationRequest(): Promise<void> {
    const state = getPostTracker(this.page);

    // 1. Listener-captured POSTs (registered before click)
    expect(
      state.urls,
      "No se debió realizar una solicitud POST a /api/documents"
    ).toHaveLength(0);

    // 2. Backstop: detect any POST whose response hasn't arrived yet
    const latePost = this.page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        new URL(response.url()).pathname === CREATE_PATH,
      { timeout: 500 }
    );
    const lateResponse = await latePost.catch(() => null);
    expect(
      lateResponse,
      "No se debió recibir respuesta de POST a /api/documents"
    ).toBeNull();

    // 3. Clean up listener
    this.cleanupPostTracking();
  }

  /**
   * Verifies that at least one creation POST was detected by the monitor.
   * Used in the control test (UI-NEG-12) to prove the tracker is functional.
   */
  async expectPostWasMade(): Promise<void> {
    const state = getPostTracker(this.page);
    expect(
      state.urls.length,
      "El monitor debió detectar al menos una solicitud POST a /api/documents"
    ).toBeGreaterThan(0);
    this.cleanupPostTracking();
  }

  /** Removes the request listener, freeing resources. Idempotent. */
  cleanupPostTracking(): void {
    const state = POST_TRACKERS.get(this.page);
    if (state?.tracker) {
      this.page.removeListener("request", state.tracker);
      state.tracker = null;
    }
  }

  /** Static cleanup used in After hooks when no DocumentFormPage instance is available. */
  static cleanupPostTrackingForPage(page: Page): void {
    const state = POST_TRACKERS.get(page);
    if (state?.tracker) {
      page.removeListener("request", state.tracker);
      state.tracker = null;
    }
  }

  /** Verifica el mensaje de error asociado a un campo del formulario. */
  async expectFieldError(field: string, message: string): Promise<void> {
    await expect(
      this.createDialog.locator(`#error-${field}`),
      `Debió mostrarse el error de campo: ${message}`
    ).toHaveText(message);
  }

  /** Verifica el mensaje de error general del formulario (visible cuando la validación falla a nivel de formulario). */
  async expectFormError(message: string): Promise<void> {
    await expect(
      this.createDialog.getByText(message, { exact: true }),
      `Debió mostrarse el error general: ${message}`
    ).toBeVisible();
  }

  /** Verifica si el campo de correo de contacto está habilitado o deshabilitado. */
  async expectContactEmailState(disabled: boolean): Promise<void> {
    const input = this.createDialog.getByLabel("Correo de contacto");
    if (disabled) {
      await expect(input, "El correo de contacto debe estar deshabilitado").toBeDisabled();
    } else {
      await expect(input, "El correo de contacto debe estar habilitado").toBeEnabled();
    }
  }
}

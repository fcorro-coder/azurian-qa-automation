import { expect, type Locator, type Page, type Response } from "@playwright/test";

const LIST_PATH = "/api/documents";
import { UI_NETWORK_TIMEOUT_MS } from "../config/timeouts";

interface DocumentRowExpectation {
  rut: string;
  tipoDte: string;
  monto: number;
  estado: string;
}

/**
 * Localizadores semánticos y esperas reutilizables del listado.
 *
 * Toda interacción que deba reflejarse en la tabla pasa por `runAndWaitForListRefresh`
 * o `searchByRut`, que esperan la respuesta HTTP del listado y luego el fin de la carga
 * (`waitForListIdle`). Así ninguna aserción puede cumplirse contra la tabla vacía o
 * desactualizada que se muestra mientras la consulta está en curso.
 */
export class DocumentsPage {
  readonly heading: Locator;
  readonly newDocumentButton: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly table: Locator;
  /** Superposición de carga del listado: presente solo mientras la consulta está en curso. */
  readonly loading: Locator;
  /** Total de resultados: el componente lo renderiza únicamente cuando la carga terminó. */
  readonly resultsCount: Locator;
  readonly emptyState: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole("heading", { name: "Documentos Tributarios Electrónicos" });
    this.newDocumentButton = page.getByRole("button", { name: "Nuevo documento" });
    this.searchInput = page.getByRole("textbox", { name: /Buscar por RUT Receptor/i });
    this.searchButton = page.getByRole("button", { name: "Buscar", exact: true });
    this.table = page.getByRole("table", { name: "Tabla de Documentos Tributarios" });
    this.loading = page.getByRole("status", { name: "Cargando documentos" });
    this.resultsCount = page.getByText(/^\d+ documentos? encontrados?$/);
    this.emptyState = page.getByText("No se encontraron documentos DTE para los criterios seleccionados");
  }

  private isListResponse(response: Response): boolean {
    const url = new URL(response.url());
    return (
      response.request().method() === "GET" &&
      url.pathname === LIST_PATH &&
      url.searchParams.has("page")
    );
  }

  /**
   * Ejecuta `action` y espera explícitamente la respuesta del listado que ella provoca,
   * valida su código y recién entonces da por terminada la carga.
   */
  private async runAndWaitForListResponse(
    action: () => Promise<void>,
    matches: (url: URL) => boolean
  ): Promise<void> {
    const pending = this.page.waitForResponse(
      (candidate) => this.isListResponse(candidate) && matches(new URL(candidate.url())),
      { timeout: UI_NETWORK_TIMEOUT_MS }
    );
    // Evita un rechazo no manejado si la acción falla antes de consumir la respuesta.
    pending.catch(() => undefined);

    await action();

    const response = await pending;
    expect(response.status(), "La consulta del listado debió responder 200").toBe(200);
    await this.waitForListIdle();
  }

  /** El listado terminó de cargar: sin superposición de carga y con el total ya renderizado. */
  async waitForListIdle(): Promise<void> {
    await expect(this.loading, "El listado debió terminar de cargar").toBeHidden();
    await expect(this.resultsCount, "El listado debió informar el total de resultados").toBeVisible();
  }

  /**
   * Ejecuta una operación de creación/edición/eliminación y espera la recarga del
   * listado que la aplicación dispara al confirmar la operación.
   */
  async runAndWaitForListRefresh(action: () => Promise<void>): Promise<void> {
    await this.runAndWaitForListResponse(action, () => true);
  }

  async searchByRut(rut: string): Promise<void> {
    await this.searchInput.fill(rut);
    await this.runAndWaitForListResponse(
      () => this.searchButton.click(),
      (url) => url.searchParams.get("rut") === rut
    );
  }

  /** Recarga la página y espera el listado inicial (sin filtros, que la recarga reinicia). */
  async reloadWithListLoaded(): Promise<void> {
    await this.runAndWaitForListResponse(
      async () => {
        await this.page.reload();
      },
      (url) => !url.searchParams.has("rut")
    );
  }

  /** Para pantallas que no muestran botón de detalle (crear/editar/eliminar). */
  rowByFolioText(folio: number): Locator {
    return this.table.getByRole("row").filter({ hasText: `#${folio}` });
  }

  /**
   * Fila identificada por su botón de detalle.
   * El localizador interno debe estar anclado en la página: anclado en la tabla,
   * `filter({ has })` exige que la fila contenga otra tabla y no resuelve nunca.
   */
  rowByFolio(folio: number): Locator {
    return this.table.getByRole("row").filter({
      has: this.page.getByRole("button", { name: `Ver detalle de folio ${folio}`, exact: true })
    });
  }

  private get folioRows(): Locator {
    return this.table.getByRole("row").filter({ hasText: "#" });
  }

  /** Comprueba que el listado informa exactamente `expected` resultados. */
  async expectResultsCount(expected: number): Promise<void> {
    const label = `${expected} ${expected === 1 ? "documento encontrado" : "documentos encontrados"}`;
    await expect(this.resultsCount, `El listado debió informar "${label}"`).toHaveText(label);
  }

  /**
   * Comprueba que ninguna fila conserva el folio. Sincroniza internamente con la carga
   * del listado, de modo que es seguro aunque un escenario futuro lo invoque sin haber
   * esperado antes: contra la tabla en carga la comprobación se cumpliría sin que la
   * consulta haya terminado.
   */
  async expectDocumentAbsent(folio: number): Promise<void> {
    await this.waitForListIdle();

    await expect(
      this.rowByFolioText(folio),
      `El folio #${folio} no debió permanecer en el listado`
    ).toHaveCount(0);
  }

  /**
   * Comprueba que existe exactamente una fila para el folio y que coincide con el RUT
   * exacto, el tipo, el monto formateado y el estado esperados.
   */
  async expectDocumentRow(folio: number, expected: DocumentRowExpectation): Promise<Locator> {
    const row = this.rowByFolioText(folio);

    await expect(row, `Debió existir exactamente una fila para el folio #${folio}`).toHaveCount(1);
    await expect(row).toContainText(`#${folio}`);
    await expect(row).toContainText(expected.rut);
    await expect(row).toContainText(expected.tipoDte);
    await expect(row).toContainText(expected.monto.toLocaleString("es-CL"));
    await expect(row).toContainText(expected.estado);

    return row;
  }

  /**
   * Comprueba el estado de tabla vacía tras aplicar un filtro sin resultados.
   * Tras sincronizar con la carga descarta primero cualquier `role="alert"` de la
   * aplicación: un error de consulta también renderiza "0 documentos encontrados"
   * con el estado vacío, y debe fallar en lugar de aprobarse como listado vacío.
   */
  async expectEmptyResults(): Promise<void> {
    await this.waitForListIdle();
    await this.expectNoErrors();
    await this.expectResultsCount(0);
    await expect(this.emptyState, "Debió mostrarse el estado vacío del listado").toBeVisible();
    await expect(this.folioRows, "La tabla no debió conservar filas con folio").toHaveCount(0);
  }

  /**
   * Ningún mensaje de error de la aplicación en el área de contenido del portal.
   * Se limita a `main` porque el anunciar de rutas de Next.js es un `role="alert"`
   * permanente que no indica un fallo de la operación.
   */
  async expectNoErrors(): Promise<void> {
    await expect(
      this.page.getByRole("main").getByRole("alert"),
      "La interfaz no debió mostrar mensajes de error"
    ).toHaveCount(0);
  }

  /** Aviso de éxito de la operación (role="status") más comprobación de ausencia de errores. */
  async expectSuccessNotice(message: string): Promise<void> {
    await expect(
      this.page.getByRole("status").filter({ hasText: message }),
      `Debió mostrarse el aviso de éxito: ${message}`
    ).toBeVisible();
    await this.expectNoErrors();
  }

  /**
   * El diálogo de detalle está visible y completamente cargado: espera que su
   * indicador interno desaparezca, garantizando que el detalle ya está renderizado.
   */
  private async waitForDetailLoaded(dialog: Locator): Promise<void> {
    await expect(dialog).toBeVisible();
    // El diálogo monta su indicador de carga en el mismo render en que se hace visible,
    // de modo que esperarlo a desaparecer garantiza que el detalle ya está cargado.
    await expect(
      dialog.getByRole("status", { name: "Cargando detalle del documento" }),
      "El detalle debió terminar de cargar"
    ).toBeHidden();
  }

  async openDetail(folio: number): Promise<Locator> {
    const row = this.rowByFolio(folio);
    await expect(row, `Debió existir la fila del folio #${folio} para abrir el detalle`).toHaveCount(1);

    await row.getByRole("button", { name: /Ver detalle/i }).click();

    const dialog = this.page.getByRole("dialog");
    await this.waitForDetailLoaded(dialog);

    return dialog;
  }

  /** Diálogo de detalle ya abierto, re-sincronizado con su estado cargado. */
  async expectDetailDialog(): Promise<Locator> {
    const dialog = this.page.getByRole("dialog");
    await this.waitForDetailLoaded(dialog);

    return dialog;
  }

  async validateList(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.newDocumentButton).toBeVisible();
    for (const column of ["Folio", "Tipo DTE", "RUT Receptor", "Monto Total", "Fecha Emisión", "Estado", "Acciones"]) {
      await expect(
        this.table.getByRole("columnheader", { name: column, exact: true }),
        `La columna ${column} debió estar visible`
      ).toBeVisible();
    }
    await this.waitForListIdle();
  }

  /** Envía un documento al SII desde el listado y espera la recarga (incluye el aviso de resultado). */
  async sendToSii(folio: number): Promise<void> {
    const row = this.rowByFolio(folio);
    const button = row.getByRole("button", { name: `Enviar al SII folio ${folio}`, exact: true });
    await expect(button, "El botón de envío debe estar habilitado para documentos pendientes").toBeEnabled();
    await this.runAndWaitForListRefresh(() => button.click());
  }

  /** Verifica que la fila del documento muestra el estado esperado en la interfaz. */
  async expectRowState(folio: number, estadoUI: string): Promise<void> {
    const row = this.rowByFolio(folio);
    await expect(row, `La fila debe mostrar el estado ${estadoUI}`).toContainText(estadoUI);
  }

  /** Verifica que un botón de acción en la fila está deshabilitado con el título explicativo correcto. */
  async expectRowButtonDisabled(
    folio: number,
    buttonAriaLabel: string,
    expectedTitle: string
  ): Promise<void> {
    const row = this.rowByFolio(folio);
    const button = row.getByRole("button", { name: buttonAriaLabel, exact: true });
    await expect(button, "El botón debe estar deshabilitado").toBeDisabled();
    await expect(button, "El título debe explicar el bloqueo").toHaveAttribute("title", expectedTitle);
  }
}

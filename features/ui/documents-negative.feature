@ui @negativo @severity:high @epic:Azurian @story:Validaciones_UI
Feature: Validaciones negativas del formulario de documentos
  Como usuario autenticado
  Quiero recibir retroalimentación clara al enviar datos inválidos
  Para corregir errores sin crear documentos inválidos

  Background:
    Given que ingreso al portal Azurian con credenciales válidas

  @severity:high
  Scenario: UI-NEG-01 El formulario muestra errores de campo requerido al intentar guardar vacío
    When abro el formulario de nuevo documento
    And intento guardar el formulario
    Then debo ver el mensaje de error "El folio es obligatorio."
    And debo ver el mensaje de error "El RUT del receptor es obligatorio."
    And debo ver el mensaje de error "El monto es obligatorio."
    And debo ver el mensaje de error general "Corrige los campos indicados antes de continuar."
    And el formulario permanece abierto

  @severity:high
  Scenario: UI-NEG-02 Un RUT con dígito verificador incorrecto muestra error de validación
    When abro el formulario de nuevo documento
    And completo los datos válidos del documento
    And cambio el RUT receptor a "77.341.920-0"
    And intento guardar el formulario
    Then debo ver el mensaje de error "El dígito verificador del RUT no es válido."
    And el formulario permanece abierto

  @severity:high
  Scenario: UI-NEG-03 Un folio fuera de rango muestra error y el formulario no se cierra
    When abro el formulario de nuevo documento
    And completo los datos válidos del documento
    And cambio el folio a 0
    And intento guardar el formulario
    Then debo ver el mensaje de error "El folio debe estar entre 1 y 9.999.999."
    And el formulario permanece abierto

  @severity:high
  Scenario: UI-NEG-04 Un monto fuera de rango muestra error y el formulario no se cierra
    When abro el formulario de nuevo documento
    And completo los datos válidos del documento
    And cambio el monto a 0
    And intento guardar el formulario
    Then debo ver el mensaje de error "El monto debe estar entre 1 y 999.999.999."
    And el formulario permanece abierto

  @severity:medium
  Scenario: UI-NEG-05 El campo de observaciones limita la entrada a 300 caracteres
    When abro el formulario de nuevo documento
    And completo los datos válidos del documento
    And lleno las observaciones con 301 caracteres
    Then el campo de observaciones contiene como máximo 300 caracteres

  @severity:medium
  Scenario: UI-NEG-06 El correo de contacto se habilita solo cuando corresponde
    When abro el formulario de nuevo documento
    Then el campo de correo de contacto debe estar deshabilitado
    When selecciono el canal de entrega "Correo electrónico"
    Then el campo de correo de contacto debe estar habilitado
    When selecciono el canal de entrega "Portal"
    Then el campo de correo de contacto debe estar deshabilitado nuevamente

  @severity:high
  Scenario: UI-NEG-07 Un correo de contacto inválido con sendCopy habilitado muestra error
    When abro el formulario de nuevo documento
    And completo los datos válidos del documento
    And marco enviar copia al contacto
    And completo el correo de contacto con un valor inválido
    And intento guardar el formulario
    Then debo ver el mensaje de error "El correo de contacto no tiene un formato válido."
    And el formulario permanece abierto

  @severity:high
  Scenario: UI-NEG-08 La edición y eliminación de un documento Aceptado está bloqueada
    Given creo y envío un documento pendiente al SII
    Then debo ver el resultado del envío con estado "Aceptado"
    And la fila del documento muestra el estado "Aceptado"
    And el botón de editar está deshabilitado con el título "Un documento aceptado no puede modificarse ni eliminarse."
    And el botón de eliminar está deshabilitado con el título "Un documento aceptado no puede modificarse ni eliminarse."

  @severity:medium
  Scenario: UI-NEG-09 Envío al SII con monto mayor a 10.000.000 resulta en estado Rechazado
    Given creo un documento con monto 15000000 para enviar al SII
    When envío el documento al SII
    Then debo ver el resultado del envío con estado "Rechazado"
    And la fila del documento muestra el estado "Rechazado"

  @severity:medium
  Scenario: UI-NEG-10 El tipo de DTE y folio no se pueden modificar en edición
    Given creo un documento pendiente para actualizar
    When abro el formulario de edición del documento pendiente
    Then el campo de tipo de DTE debe estar deshabilitado
    And el campo de número de folio debe estar deshabilitado
    And el campo de monto total debe estar habilitado

  @severity:high
  Scenario: UI-NEG-11 Un archivo adjunto con extensión no permitida muestra error
    When abro el formulario de nuevo documento
    And completo los datos válidos del documento
    And intento adjuntar un archivo con extensión no permitida
    Then debo ver el mensaje de error "El documento de respaldo debe ser un archivo .pdf, .xml o .txt."
    And no se crea el documento en el listado

  @severity:low
  Scenario: UI-NEG-12 Control: el monitor detecta una solicitud POST real al crear un documento válido
    When abro el formulario de nuevo documento
    And completo los datos válidos del documento
    And intento guardar el formulario
    Then debo ver el aviso de éxito del documento creado
    And el monitor confirma que se realizó una solicitud POST

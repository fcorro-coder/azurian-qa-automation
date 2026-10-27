@api @negativo @severity:critical @epic:Azurian @story:Validaciones_negativas
Feature: Errores de validación, autorización y conflicto de documentos electrónicos
  Como usuario del API de documentos
  Quiero recibir respuestas de error claras ante datos inválidos, credenciales inválidas y folios duplicados
  Para detectar fallos de validación, autenticación y aislamiento por ejecución

  Background:
    Given que tengo una sesión API autenticada

  @validacion
  Scenario Outline: API-NEG-02 Crear un documento con un campo inválido responde 400
    When intento crear un documento con el campo "<campo>" y el valor "<valor>"
    Then la creación debe responder con código 400
    And la respuesta de validación debe detallar el campo "<campo>" con el mensaje "<mensaje>"

    Examples:
      | campo           | valor        | mensaje                                                     |
      | tipoDte         | DTE 99       | Tipo de DTE no soportado. Usa DTE 33, DTE 34 o DTE 39.      |
      | monto           | 0            | El monto debe estar entre 1 y 999.999.999.                  |
      | folio           | 0            | El folio debe estar entre 1 y 9.999.999.                    |
      | rutReceptor     | 12.345.678-9 | El dígito verificador del RUT no es válido.                 |
      | deliveryChannel | WHATSAPP     | Canal de entrega no soportado. Usa PORTAL o EMAIL.          |
      | fechaEmision    | 31-12-2026   | La fecha de emisión debe tener formato YYYY-MM-DD.          |

  @autorizacion
  Scenario: API-NEG-03a Consultar el listado sin el encabezado Authorization responde 401
    When consulto el listado de documentos con la autenticación "sin-encabezado"
    Then la consulta de documentos debe responder con código 401
    And la respuesta de autorización debe detallar el mensaje "Falta el encabezado Authorization: Bearer <token>."

  @autorizacion
  Scenario: API-NEG-03b Consultar el listado con un token inválido responde 401
    When consulto el listado de documentos con la autenticación "token-invalido"
    Then la consulta de documentos debe responder con código 401
    And la respuesta de autorización debe detallar el mensaje "Token inválido."

  @conflicto
  Scenario: API-NEG-04 Crear el mismo folio en el mismo runId responde 409 y el aislamiento por runId permite un runId distinto
    When creo un documento electrónico con los siguientes datos:
      | tipoDte | monto  |
      | DTE 33  | 150000 |
    Then la creación debe responder con código 201
    When vuelvo a crear un documento con el mismo folio y el mismo runId
    Then la creación debe responder con código 409
    And la respuesta de conflicto debe detallar el mensaje "Ya existe un documento con ese folio para esta ejecución."
    When creo el mismo folio con un runId distinto
    Then la creación debe responder con código 201
    And el documento creado debe conservar sus datos

@api @leer @severity:normal @epic:Azurian @story:Consultar_documento
Feature: Consulta de documentos del laboratorio
  Como usuario autenticado
  Quiero consultar los documentos disponibles
  Para verificar que puedo acceder a la información del laboratorio

  Background:
    Given que tengo una sesión API autenticada

  Scenario: API-CRUD-02 Consultar el listado de documentos
    Given existen documentos propios para consultar el listado
    When consulto el listado de documentos
    Then la consulta de documentos debe responder con código 200
    And debo recibir un listado de documentos
    And el listado contiene mi documento con los datos correctos

  @negativo
  Scenario: API-NEG-01 Consultar un documento inexistente devuelve HTTP 404
    When consulto un documento con identificador inexistente
    Then la consulta individual debe responder con código 404

  @filtros
  Scenario: API-FILTER-01 Consultar por RUT y tipo DTE y recuperar el folio exacto
    Given existen documentos propios para consultar por filtros
    When filtro documentos por RUT y tipo DTE
    Then el listado filtrado contiene el folio esperado y su detalle completo

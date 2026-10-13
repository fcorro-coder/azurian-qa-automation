@ui @leer
Feature: Consulta de documentos desde la interfaz
  Como usuario autenticado
  Quiero consultar documentos electrónicos
  Para verificar los datos del documento correcto entre varios registros

  Scenario: UI-CRUD-02 Consultar el detalle del folio exacto filtrando por RUT
    Given que ingreso al portal Azurian con credenciales válidas
    And que existen dos documentos propios con el mismo RUT para consultar
    When consulto el módulo de documentos electrónicos
    Then debo visualizar el listado de documentos
    When filtro por el RUT del documento propio
    Then identifico el folio exacto entre varios documentos del mismo RUT
    When abro el detalle del folio exacto
    Then el detalle debe mostrar el folio, RUT, tipo y monto correctos

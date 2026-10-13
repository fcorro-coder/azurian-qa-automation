@ui @crear
Feature: Creación de documentos desde la interfaz
  Como usuario autenticado
  Quiero registrar documentos electrónicos
  Para emitir nuevos DTE

  Scenario: UI-CRUD-01 Visualizar el formulario de creación
    Given que ingreso al portal Azurian con credenciales válidas
    When abro el formulario de nuevo documento
    Then debo visualizar los campos obligatorios de creación

  Scenario: UI-CRUD-01-2 Crear un documento electrónico con datos válidos
    Given que ingreso al portal Azurian con credenciales válidas
    When abro el formulario de nuevo documento
    And completo los datos válidos del documento
    And guardo el documento desde la interfaz
    Then debo encontrar el documento creado en el listado

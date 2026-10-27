@ui @crear @severity:normal @epic:Azurian @story:Crear_documento
Feature: Creación de documentos desde la interfaz
  Como usuario autenticado
  Quiero registrar documentos electrónicos
  Para emitir nuevos DTE

  Background:
    Given que ingreso al portal Azurian con credenciales válidas

  Scenario: UI-CRUD-01 Visualizar el formulario de creación
    When abro el formulario de nuevo documento
    Then debo visualizar los campos obligatorios de creación

  Scenario: UI-CRUD-01-2 Crear un documento electrónico con datos válidos
    When abro el formulario de nuevo documento
    And completo los datos válidos del documento
    And guardo el documento desde la interfaz
    Then debo encontrar el documento creado en el listado

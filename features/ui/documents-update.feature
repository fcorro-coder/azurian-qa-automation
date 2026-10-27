@ui @editar @severity:normal @epic:Azurian @story:Actualizar_documento
Feature: Actualización de documentos desde la interfaz
  Como usuario autenticado
  Quiero actualizar documentos pendientes
  Para corregir su información

  Background:
    Given que ingreso al portal Azurian con credenciales válidas

  Scenario Outline: UI-CRUD-03 Actualizar el monto de un documento pendiente
    Given creo un documento pendiente para actualizar
    When modifico su monto a <monto> desde la interfaz
    Then debo visualizar el monto actualizado en el listado

    Examples:
      | monto   |
      | 250000  |

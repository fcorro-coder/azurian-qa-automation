@ui @editar
Feature: Actualización de documentos desde la interfaz
  Como usuario autenticado
  Quiero actualizar documentos pendientes
  Para corregir su información

  Scenario: UI-CRUD-03 Actualizar el monto de un documento pendiente
    Given que ingreso al portal Azurian con credenciales válidas
    And creo un documento pendiente para actualizar
    When modifico su monto a 250000 desde la interfaz
    Then debo visualizar el monto actualizado en el listado

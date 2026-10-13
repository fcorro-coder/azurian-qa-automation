@ui @eliminar
Feature: Eliminación de documentos desde la interfaz
  Como usuario autenticado
  Quiero eliminar documentos pendientes
  Para retirar registros que ya no necesito

  Scenario: UI-CRUD-04 Eliminar un documento pendiente desde la interfaz
    Given que ingreso al portal Azurian con credenciales válidas
    And creo un documento pendiente para eliminar
    When elimino el documento desde la interfaz
    Then el documento eliminado no debe aparecer en el listado

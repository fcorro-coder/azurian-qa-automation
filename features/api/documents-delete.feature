@api @eliminar
Feature: Eliminación de documentos electrónicos
  Como usuario autenticado
  Quiero eliminar documentos pendientes
  Para retirar registros que ya no necesito

  Scenario: API-CRUD-04 Eliminar un documento pendiente
    Given que tengo una sesión API autenticada
    And existe un documento pendiente creado para la prueba
    When elimino el documento pendiente
    Then la eliminación debe responder con código 204
    And el documento eliminado ya no debe estar disponible

@api @editar
Feature: Actualización de documentos electrónicos
  Como usuario autenticado
  Quiero actualizar documentos pendientes
  Para corregir sus datos antes de enviarlos

  Scenario: API-CRUD-03 Actualizar el monto de un documento pendiente
    Given que tengo una sesión API autenticada
    And existe un documento pendiente creado para la prueba
    When actualizo el monto del documento a 250000
    Then la actualización debe responder con código 200
    And el documento debe conservar el monto actualizado

@api @editar @severity:normal @epic:Azurian @story:Actualizar_documento
Feature: Actualización de documentos electrónicos
  Como usuario autenticado
  Quiero actualizar documentos pendientes
  Para corregir sus datos antes de enviarlos

  Background:
    Given que tengo una sesión API autenticada

  Scenario Outline: API-CRUD-03 Actualizar el monto de un documento pendiente
    Given existe un documento pendiente creado para la prueba
    When actualizo el monto del documento a <monto>
    Then la actualización debe responder con código 200
    And el documento debe conservar el monto actualizado

    Examples:
      | monto   |
      | 250000  |

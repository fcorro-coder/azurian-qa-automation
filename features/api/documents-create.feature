@api @crear @severity:normal @epic:Azurian @story:Crear_documento
Feature: Creación de documentos electrónicos
  Como usuario autenticado
  Quiero registrar documentos electrónicos
  Para gestionar su emisión en el laboratorio

  Background:
    Given que tengo una sesión API autenticada

  Scenario: API-CRUD-01 Crear un documento electrónico válido
    When creo un documento electrónico con los siguientes datos:
      | tipoDte | monto  |
      | DTE 33  | 150000 |
    Then la creación debe responder con código 201
    And el documento creado debe conservar sus datos
    And puedo recuperar el documento creado por su identificador


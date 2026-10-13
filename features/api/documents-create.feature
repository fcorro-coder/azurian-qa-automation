@api @crear
Feature: Creación de documentos electrónicos
  Como usuario autenticado
  Quiero registrar documentos electrónicos
  Para gestionar su emisión en el laboratorio

  Scenario: API-CRUD-01 Crear un documento electrónico válido
    Given que tengo una sesión API autenticada
    When creo un documento electrónico con datos válidos
    Then la creación debe responder con código 201
    And el documento creado debe conservar sus datos
    And puedo recuperar el documento creado por su identificador


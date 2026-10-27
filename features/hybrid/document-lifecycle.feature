@api @ui @hibrido @severity:critical @epic:Azurian @story:Consistencia_API_UI
Feature: Persistencia cruzada de un documento tributario entre API e interfaz
  Como responsable de calidad
  Quiero verificar el mismo documento desde ambas capas
  Para garantizar consistencia y aislamiento por ejecución

  Scenario: HYB-01 Crear por API, actualizar por interfaz y eliminar por API
    Given que tengo una sesión API autenticada
    And que ingreso al portal Azurian con credenciales válidas
    When creo un documento electrónico con los siguientes datos:
      | tipoDte | monto  |
      | DTE 33  | 150000 |
    Then la creación debe responder con código 201
    And el documento creado debe conservar sus datos
    When consulto desde la interfaz el documento creado por API
    Then la interfaz debe mostrar los datos exactos del documento
    When actualizo desde la interfaz el monto del documento híbrido a 250000
    Then el API debe reflejar el nuevo monto del documento híbrido
    When elimino el documento pendiente
    Then la eliminación debe responder con código 204
    And el documento eliminado ya no debe estar disponible

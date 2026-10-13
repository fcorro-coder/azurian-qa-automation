@api @smoke
Feature: Disponibilidad del laboratorio Azurian
  Como equipo de QA
  Quiero verificar la disponibilidad de la API
  Para asegurar que el entorno está listo para ejecutar las pruebas

  Scenario: API-SMOKE-01 Verificar que el laboratorio responde correctamente
    Given que el laboratorio Azurian está configurado
    When consulto el estado de salud de la API
    Then la API debe responder con código 200
    And el estado del laboratorio debe ser "ok"

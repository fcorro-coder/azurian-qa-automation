@api @smoke @severity:normal @epic:Azurian @story:Disponibilidad
Feature: Disponibilidad del laboratorio Azurian
  Como equipo de QA
  Quiero verificar la disponibilidad de la API
  Para asegurar que el entorno está listo para ejecutar las pruebas

  Background:
    Given que el laboratorio Azurian está configurado

  Scenario: API-SMOKE-01 Verificar que el laboratorio responde correctamente
    When consulto el estado de salud de la API
    Then la API debe responder con código 200
    And el estado del laboratorio debe ser "ok"

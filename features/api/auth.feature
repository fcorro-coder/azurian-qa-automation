@api @auth @severity:blocker @epic:Azurian @story:Autenticación
Feature: Autenticación en el laboratorio Azurian
  Como usuario autorizado
  Quiero autenticarme en el laboratorio
  Para acceder a las operaciones protegidas

  Background:
    Given que el cliente de autenticación está preparado

  Scenario: API-AUTH-01 Autenticación exitosa con credenciales válidas
    When inicio sesión con las credenciales válidas
    Then debo recibir un token de autenticación
    And puedo consultar mi información con el token recibido


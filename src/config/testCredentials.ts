export interface TestCredential {
  usuario: string;
  contrasena: string;
  rol: string;
}

export const TEST_CREDENTIALS: TestCredential[] = [
  { usuario: "admin", contrasena: "admin123", rol: "ADMIN" },
  { usuario: "director_test", contrasena: "dir123", rol: "DIRECTOR" },
  { usuario: "dr_test", contrasena: "med123", rol: "MEDICO" },
  { usuario: "nurse_test", contrasena: "nurse123", rol: "ENFERMERA" },
  { usuario: "V-20111222", contrasena: "farm123", rol: "FARMACEUTICO" },
  { usuario: "lab_test", contrasena: "lab123", rol: "TECNICO_LAB" },
  { usuario: "adm_test", contrasena: "adm123", rol: "ADMISIONISTA" },
  { usuario: "fact_test", contrasena: "fact123", rol: "FACTURADOR" },
  { usuario: "V-87654321", contrasena: "pac123", rol: "PACIENTE" },
];

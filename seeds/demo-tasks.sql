INSERT INTO tasks (id, title, assignee, status)
VALUES
  ('17c2a87e-2f4b-4bc1-a1a4-58f811732f01', 'Preparar el informe semanal', 'Ana Torres', 'pending'),
  ('17c2a87e-2f4b-4bc1-a1a4-58f811732f02', 'Revisar el calendario del equipo', 'Luis Rivera', 'in_progress'),
  ('17c2a87e-2f4b-4bc1-a1a4-58f811732f03', 'Compartir las notas de la reunión', 'Sofía Díaz', 'done')
ON CONFLICT (id) DO NOTHING
RETURNING id;

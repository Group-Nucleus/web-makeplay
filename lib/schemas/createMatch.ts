import { z } from 'zod';

export const step1Schema = z.object({
  sport: z.string().min(1, 'Selecione um esporte'),
});

export const step2Schema = z.object({
  name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  location: z.string().min(3, 'Informe o local da partida'),
  day: z.string().min(1, 'Informe o dia do jogo'),
  startTime: z.string().min(1, 'Informe o horário de início'),
  duration: z.string().min(1, 'Informe a duração'),
  gameType: z.string().min(1, 'Informe o tipo de jogo'),
  spots: z.number().int().min(2, 'Mínimo 2 vagas'),
});

export const step3Schema = z
  .object({
    pricePerGame: z.number().min(0, 'Preço não pode ser negativo'),
    priceMonthly: z.number().min(0, 'Preço não pode ser negativo'),
    intensity: z.string().min(1, 'Informe a intensidade'),
    ageMin: z.number().min(14).max(59),
    ageMax: z.number().min(15).max(60),
  })
  .refine((d) => d.ageMax > d.ageMin, {
    message: 'Idade máxima deve ser maior que a mínima',
    path: ['ageMax'],
  });

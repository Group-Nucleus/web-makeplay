'use client';

import { useState } from 'react';

import { step1Schema, step2Schema, step3Schema } from '@/lib/schemas/createMatch';
import type { CreateMatchForm, MatchPrivacy, MatchType, SportType, Venue } from '@/lib/models/match';
import { createMatch } from '@/lib/repositories/match';

const INITIAL: Omit<CreateMatchForm, 'type'> = {
  sport: '',
  name: '',
  location: '',
  day: '',
  startTime: '',
  duration: '',
  gameType: '',
  spots: 16,
  pricePerGame: 12,
  priceMonthly: 60,
  intensity: 'Moderado',
  ageMin: 14,
  ageMax: 60,
  privacy: 'invite-only',
  hideFromAbsent: false,
  hidePhoneNumber: false,
};

export function useCreateMatch(matchType: MatchType, onComplete: () => void) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<CreateMatchForm>({ ...INITIAL, type: matchType });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  const setField = <K extends keyof CreateMatchForm>(key: K, value: CreateMatchForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = (schema: typeof step1Schema | typeof step2Schema | typeof step3Schema) => {
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((i) => {
        fieldErrors[String(i.path[0])] = i.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const setVenue = (venue: Venue | null) => {
    setSelectedVenue(venue);
    setForm((f) => ({
      ...f,
      venueId: venue?.id,
      location: venue?.address ?? f.location,
    }));
  };

  const submit = async () => {
    if (!validate(step3Schema)) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await createMatch(form);
      setStep(1);
      setForm({ ...INITIAL, type: matchType });
      setSelectedVenue(null);
      onComplete();
    } catch {
      setSubmitError('Erro ao criar partida. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    step,
    form,
    errors,
    isSubmitting,
    submitError,
    selectedVenue,
    setField,
    setSport: (sport: SportType) => setField('sport', sport),
    setPrivacy: (privacy: MatchPrivacy) => setField('privacy', privacy),
    setVenue,
    goToStep1: () => setStep(1),
    goToStep2: () => {
      if (validate(step1Schema)) setStep(2);
    },
    goToStep3: () => {
      if (validate(step2Schema)) setStep(3);
    },
    submit,
  };
}

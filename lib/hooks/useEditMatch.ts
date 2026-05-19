'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import { ApiError } from '@/lib/api/client';
import { editMatchSchema, type EditMatchFormValues } from '@/lib/schemas/editMatch';
import type { MatchDocument } from '@/lib/models/match-document';
import type { SportType, Venue } from '@/lib/models/match';
import type { UpdateMatchPayload } from '@/lib/api/types/match';
import { updateMatch } from '@/lib/repositories/match';

export function useEditMatch(
  matchId: string,
  doc: MatchDocument | null,
  confirmedCount: number,
  onSaved: () => void,
) {
  const initialVenueIdRef = useRef<string | undefined>(undefined);
  const [form, setForm] = useState<EditMatchFormValues | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [venueRemoved, setVenueRemoved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resetFromDoc = useCallback((d: MatchDocument) => {
    initialVenueIdRef.current = d.venueId;
    setVenueRemoved(false);
    setSelectedVenue(null);
    setForm({
      sport: d.sport,
      name: d.name,
      location: d.location,
      day: d.day,
      startTime: d.startTime,
      duration: d.duration,
      gameType: d.gameType,
      spots: d.spots,
      pricePerGame: d.pricePerGame,
      priceMonthly: d.priceMonthly,
      intensity: d.intensity,
      ageMin: d.ageMin,
      ageMax: d.ageMax,
      privacy: d.privacy,
      hideFromAbsent: d.hideFromAbsent,
      hidePhoneNumber: d.hidePhoneNumber,
      description: d.description ?? '',
    });
    setErrors({});
    setSubmitError(null);
  }, []);

  useEffect(() => {
    if (doc) resetFromDoc(doc);
  }, [doc, resetFromDoc]);

  const editMutation = useMutation({
    mutationFn: (body: UpdateMatchPayload) => updateMatch(matchId, body),
    onSuccess: () => onSaved(),
    onError: (e) => {
      setSubmitError(
        e instanceof ApiError ? e.message : 'Erro ao guardar alterações. Tente novamente.',
      );
    },
  });

  const setField = <K extends keyof EditMatchFormValues>(
    key: K,
    value: EditMatchFormValues[K],
  ) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  };

  const setVenue = (venue: Venue | null) => {
    setSelectedVenue(venue);
    setVenueRemoved(venue === null && !!initialVenueIdRef.current);
    if (venue) {
      setForm((f) => (f ? { ...f, location: venue.address || f.location } : f));
    }
  };

  const submit = () => {
    if (!form || !doc) return;

    const parsed = editMatchSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        fieldErrors[String(i.path[0])] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (form.spots < confirmedCount) {
      setSubmitError(
        `Vagas (${form.spots}) não podem ser menores que os confirmados (${confirmedCount}).`,
      );
      return;
    }

    const body: UpdateMatchPayload = {
      sport: form.sport as SportType,
      name: form.name,
      location: form.location,
      day: form.day,
      startTime: form.startTime,
      duration: form.duration,
      gameType: form.gameType,
      spots: form.spots,
      pricePerGame: form.pricePerGame,
      priceMonthly: form.priceMonthly,
      intensity: form.intensity,
      ageMin: form.ageMin,
      ageMax: form.ageMax,
      privacy: form.privacy as MatchDocument['privacy'],
      hideFromAbsent: form.hideFromAbsent,
      hidePhoneNumber: form.hidePhoneNumber,
      description: form.description.trim() || null,
    };

    if (!doc.seriesId) body.type = doc.type;
    if (selectedVenue) body.venueId = selectedVenue.id;
    else if (venueRemoved) body.venueId = null;

    setSubmitError(null);
    editMutation.mutate(body);
  };

  return {
    form,
    errors,
    isSubmitting: editMutation.isPending,
    submitError,
    selectedVenue,
    initialVenueId: initialVenueIdRef.current,
    setField,
    setSport: (sport: SportType) => setField('sport', sport),
    setPrivacy: (privacy: MatchDocument['privacy']) => setField('privacy', privacy),
    setVenue,
    submit,
    resetFromDoc,
  };
}

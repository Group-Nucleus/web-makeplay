'use client';

import { useState } from 'react';

import type { SportType, Venue } from '@/lib/models/match';
import { createVenue } from '@/lib/repositories/venue';

interface CreateVenueFormState {
  name: string;
  address: string;
  neighborhood: string;
  city: string;
  phone: string;
  openingHours: string;
  sports: SportType[];
  amenities: string[];
  isPublic: boolean;
}

const INITIAL: CreateVenueFormState = {
  name: '',
  address: '',
  neighborhood: '',
  city: '',
  phone: '',
  openingHours: '',
  sports: [],
  amenities: [],
  isPublic: true,
};

export function useCreateVenue(onCreated: (venue: Venue) => void) {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const setField = <K extends keyof CreateVenueFormState>(key: K, value: CreateVenueFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleSport = (sp: SportType) => {
    setForm((f) => ({
      ...f,
      sports: f.sports.includes(sp) ? f.sports.filter((s) => s !== sp) : [...f.sports, sp],
    }));
  };

  const toggleAmenity = (key: string) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(key)
        ? f.amenities.filter((a) => a !== key)
        : [...f.amenities, key],
    }));
  };

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Nome é obrigatório';
    if (!form.address.trim()) next.address = 'Endereço é obrigatório';
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const id = await createVenue({
        name: form.name.trim(),
        address: form.address.trim(),
        neighborhood: form.neighborhood.trim() || undefined,
        city: form.city.trim() || undefined,
        phone: form.phone.trim() || undefined,
        openingHours: form.openingHours.trim() || undefined,
        sports: form.sports,
        amenities: form.amenities.length > 0 ? form.amenities : undefined,
        photos: [],
        isPublic: form.isPublic,
      });
      const venue: Venue = {
        id,
        name: form.name.trim(),
        address: form.address.trim(),
        neighborhood: form.neighborhood.trim() || undefined,
        city: form.city.trim() || undefined,
        sports: form.sports,
      };
      setForm(INITIAL);
      onCreated(venue);
    } catch (e) {
      setErrors({
        submit: e instanceof Error ? e.message : 'Não foi possível cadastrar a quadra',
      });
    } finally {
      setSaving(false);
    }
  };

  return { form, errors, saving, setField, toggleSport, toggleAmenity, submit };
}

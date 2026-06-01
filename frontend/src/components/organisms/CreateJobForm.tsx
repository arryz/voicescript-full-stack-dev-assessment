import { useState } from 'react';
import type { FormEvent } from 'react';
import type { CreateJobRequest, LocationType } from '../../types/api';
import * as api from '../../services/api';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Select } from '../atoms/Select';
import { ErrorMessage } from '../atoms/ErrorMessage';
import { FormField } from '../molecules/FormField';

interface Props {
  onCreated: () => void;
}

export function CreateJobForm({ onCreated }: Props) {
  const [caseName, setCaseName] = useState('');
  const [duration, setDuration] = useState('');
  const [locationType, setLocationType] = useState<LocationType>('physical');
  const [city, setCity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const data: CreateJobRequest = {
      case_name: caseName,
      duration_minutes: parseInt(duration, 10),
      location_type: locationType,
      ...(locationType === 'physical' ? { city } : {}),
    };

    try {
      await api.createJob(data);
      setCaseName('');
      setDuration('');
      setLocationType('physical');
      setCity('');
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Create New Job</h2>
      {error && <ErrorMessage message={error} className="mb-3" />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Case Name">
          <Input
            type="text"
            value={caseName}
            onChange={(e) => setCaseName(e.target.value)}
            placeholder="e.g. Smith v. Jones"
            required
          />
        </FormField>

        <FormField label="Duration (minutes)">
          <Input
            type="number"
            min="1"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="e.g. 90"
            required
          />
        </FormField>

        <FormField label="Location Type">
          <Select
            value={locationType}
            onChange={(e) => setLocationType(e.target.value as LocationType)}
          >
            <option value="physical">Physical</option>
            <option value="remote">Remote</option>
          </Select>
        </FormField>

        {locationType === 'physical' && (
          <FormField label="City">
            <Input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Jakarta"
              required
            />
          </FormField>
        )}
      </div>

      <Button type="submit" disabled={submitting} className="mt-4">
        {submitting ? 'Creating…' : 'Create Job'}
      </Button>
    </form>
  );
}

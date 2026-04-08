"use client";

import { useState } from "react";
import type { TripRequest } from "@/lib/api";

interface TripFormProps {
  onSubmit: (request: TripRequest) => void;
  loading: boolean;
}

const INTEREST_OPTIONS = [
  { value: "sightseeing", label: "Sightseeing" },
  { value: "food", label: "Food" },
  { value: "history", label: "History" },
  { value: "culture", label: "Culture" },
  { value: "art", label: "Art" },
  { value: "shopping", label: "Shopping" },
  { value: "nightlife", label: "Nightlife" },
  { value: "nature", label: "Nature" },
  { value: "museums", label: "Museums" },
  { value: "coffee", label: "Coffee" },
];

export default function TripForm({ onSubmit, loading }: TripFormProps) {
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [interests, setInterests] = useState<string[]>([]);

  function toggleInterest(value: string) {
    setInterests((prev) =>
      prev.includes(value)
        ? prev.filter((i) => i !== value)
        : [...prev, value]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!city || !startDate || !endDate || !budget) return;

    onSubmit({
      city,
      country,
      start_date: startDate,
      end_date: endDate,
      budget: parseFloat(budget),
      currency,
      interests,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800">Plan Your Trip</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            City
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Rome"
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Country
          </label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. Italy"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Budget
          </label>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="e.g. 800"
            min="0"
            step="50"
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="JPY">JPY (¥)</option>
            <option value="SGD">SGD (S$)</option>
            <option value="CNY">CNY (¥)</option>
            <option value="THB">THB (฿)</option>
            <option value="TRY">TRY (₺)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">
          Interests (optional — we&apos;ll prioritise what you love)
        </label>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleInterest(opt.value)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                interests.includes(opt.value)
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-300 hover:border-blue-400"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !city || !startDate || !endDate || !budget}
        className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Optimising your trip..." : "Plan My Trip"}
      </button>
    </form>
  );
}

'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface CountryFilterProps {
  allCountries: string[];
  selectedCountry: string | null;
}

export function CountryFilter({ allCountries, selectedCountry }: CountryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCountrySelect = (country: string | null) => {
    if (country) {
      router.push(`/?country=${encodeURIComponent(country)}`);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">
          {selectedCountry ? `Filtered by: ${selectedCountry}` : 'Filter by Country'}
        </h2>
        {selectedCountry && (
          <button
            onClick={() => handleCountrySelect(null)}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Reset Filter
          </button>
        )}
      </div>
      
      {/* Country chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleCountrySelect(null)}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            !selectedCountry 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          All Countries
        </button>
        {allCountries.map((country) => (
          <button
            key={country}
            onClick={() => handleCountrySelect(country)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selectedCountry === country
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {country}
          </button>
        ))}
      </div>
    </div>
  );
}
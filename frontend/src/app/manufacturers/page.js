"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getApiBaseUrl } from "@/lib/api";

export default function ManufacturersListing() {
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchManufacturers = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/auth/manufacturers`);
        const json = await res.json();
        if (json.success) {
          setManufacturers(json.data);
        } else {
          setError("Failed to load manufacturers");
        }
      } catch (err) {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };

    fetchManufacturers();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading manufacturers...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Our Verified Manufacturers
        </h2>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
          Connect with top-tier sports equipment manufacturers for your wholesale needs.
        </p>
      </div>
      <div className="mt-12 max-w-lg mx-auto grid gap-5 lg:grid-cols-3 lg:max-w-none">
        {manufacturers.length === 0 ? (
          <p className="text-center text-gray-500 col-span-3">No manufacturers found.</p>
        ) : (
          manufacturers.map((manufacturer) => (
            <div key={manufacturer._id} className="flex flex-col rounded-lg shadow-lg overflow-hidden border border-gray-200">
              <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-600">
                    {manufacturer.businessDetails?.isVerified ? "Verified Partner" : "Partner"}
                  </p>
                  <div className="block mt-2">
                    <p className="text-xl font-semibold text-gray-900">
                      {manufacturer.businessDetails?.businessName || manufacturer.name}
                    </p>
                    <p className="mt-3 text-base text-gray-500 line-clamp-3">
                      Production Capacity: {manufacturer.businessDetails?.productionCapacity || 0} units
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Location: {manufacturer.businessDetails?.city || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex items-center">
                  <Link
                    href={`/contact?manufacturerId=${manufacturer._id}`}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Contact Manufacturer
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

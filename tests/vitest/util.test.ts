import { describe, it, expect } from "vitest";
import { parseDateString, tryParseDateString } from "../../src/lib/utils";
import { URLSearchParams } from 'url';
import { ProductionReport } from "../../src/components/ProductionReport";


describe("Date Parsing Utilities", () => {
  describe("tryParseDateString", () => {
    it("should correctly parse valid dates in supported formats", () => {
      const testCases = [
        { input: "2024-10-28", expected: new Date(2024, 9, 28) }, // yyyy-MM-dd
        { input: "10/28/2024", expected: new Date(2024, 9, 28) }, // MM/dd/yyyy
        { input: "1/5/2024", expected: new Date(2024, 0, 5) }, // M/d/yyyy
        { input: "10-28-2024", expected: new Date(2024, 9, 28) }, // MM-dd-yyyy
        { input: "1-5-2024", expected: new Date(2024, 0, 5) }, // M-d-yyyy
      ];

      for (const { input, expected } of testCases) {
        expect(tryParseDateString(input)).toEqual(expected);
      }
    });

    it("should return null for invalid date strings", () => {
      const invalidDates = ["not-a-date", "2024-99-99", "13/40/2024", ""];

      for (const dateStr of invalidDates) {
        expect(tryParseDateString(dateStr)).toBeNull();
      }
    });

    it("should fall back to the native Date parser for ISO formats", () => {
      const isoDate = "2024-10-28T12:34:56Z";
      expect(tryParseDateString(isoDate)).toEqual(new Date(isoDate));
    });
  });

  describe("parseDateString", () => {
    it("should correctly parse valid date strings", () => {
      const validDate = "2024-10-28";
      expect(parseDateString(validDate)).toEqual(new Date(2024, 9, 28));
    });

    it("should throw an error for invalid date strings", () => {
      const invalidDate = "not-a-date";
      expect(() => parseDateString(invalidDate)).toThrowError(
        `Invalid date string: ${invalidDate}`
      );
    });
  });
});

describe('Production Report Function Tests', () => {
    interface ProductionData {
        state: string;
        good: number;
        reject: number;
        duration: number;
    }

    const productionReport = (data: ProductionData[]): Record<string, { good: number; reject: number; duration: number }> => {
        return data.reduce((acc, curr) => {
            if (!acc[curr.state]) {
                acc[curr.state] = { good: 0, reject: 0, duration: 0 };
            }
            acc[curr.state].good += curr.good;
            acc[curr.state].reject += curr.reject;
            acc[curr.state].duration += curr.duration;
            return acc;
        }, {} as Record<string, { good: number; reject: number; duration: number }>);
    };

    it('should summarize production data correctly', () => {
        const mockData: ProductionData[] = [
            { state: 'Running', good: 10, reject: 2, duration: 3600 },
            { state: 'Stopped', good: 0, reject: 0, duration: 0 },
        ];
        const summary = productionReport(mockData);

        expect(summary).toEqual({
            Running: { good: 10, reject: 2, duration: 3600 },
            Stopped: { good: 0, reject: 0, duration: 0 },
        });
    });

    it('should calculate total production values across states', () => {
        const mockData: ProductionData[] = [
            { state: 'Running', good: 10, reject: 2, duration: 3600 },
            { state: 'Running', good: 5, reject: 1, duration: 1800 },
            { state: 'Stopped', good: 0, reject: 0, duration: 0 },
        ];
        const summary = productionReport(mockData);

        const totals = Object.values(summary).reduce(
            (acc, curr) => {
                acc.good += curr.good;
                acc.reject += curr.reject;
                acc.duration += curr.duration;
                return acc;
            },
            { good: 0, reject: 0, duration: 0 }
        );

        expect(totals).toEqual({ good: 15, reject: 3, duration: 5400 });
    });

    it('should group data by state correctly', () => {
        const mockData: ProductionData[] = [
            { state: 'Running', good: 10, reject: 2, duration: 3600 },
            { state: 'Stopped', good: 0, reject: 0, duration: 0 },
            { state: 'Running', good: 5, reject: 1, duration: 1800 },
        ];
        const summary = productionReport(mockData);

        expect(summary).toEqual({
            Running: { good: 15, reject: 3, duration: 5400 },
            Stopped: { good: 0, reject: 0, duration: 0 },
        });
    });

    it('should compute average production metrics per state', () => {
        const mockData: ProductionData[] = [
            { state: 'Running', good: 10, reject: 2, duration: 3600 },
            { state: 'Running', good: 5, reject: 1, duration: 1800 },
        ];
        const summary = productionReport(mockData);

        const averages = Object.entries(summary).reduce((acc, [state, values]) => {
            const count = mockData.filter((item) => item.state === state).length;
            acc[state] = {
                good: values.good / count,
                reject: values.reject / count,
                duration: values.duration / count,
            };
            return acc;
        }, {} as Record<string, { good: number; reject: number; duration: number }>);

        expect(averages).toEqual({
            Running: { good: 7.5, reject: 1.5, duration: 2700 },
        });
    });
});


describe('URL Parameter Handling Tests', () => {


    interface ProductionData {
        state: string;
        good: number;
        reject: number;
        duration: number;
    }

    const productionReport = (data: ProductionData[], filters: { state?: string } = {}) => {
        const filteredData = filters.state
            ? data.filter((item) => item.state === filters.state)
            : data;

        return filteredData.reduce((acc, curr) => {
            if (!acc[curr.state]) {
                acc[curr.state] = { good: 0, reject: 0, duration: 0 };
            }
            acc[curr.state].good += curr.good;
            acc[curr.state].reject += curr.reject;
            acc[curr.state].duration += curr.duration;
            return acc;
        }, {} as Record<string, { good: number; reject: number; duration: number }>);
    };

    it('should filter production data based on URL parameters', () => {
        const mockData: ProductionData[] = [
            { state: 'Running', good: 10, reject: 2, duration: 3600 },
            { state: 'Stopped', good: 0, reject: 0, duration: 0 },
            { state: 'Running', good: 5, reject: 1, duration: 1800 },
        ];

        const urlParams = new URLSearchParams('?state=Running');
        const stateFilter = urlParams.get('state');

        const summary = productionReport(mockData, { state: stateFilter || undefined });

        expect(summary).toEqual({
            Running: { good: 15, reject: 3, duration: 5400 },
        });
    });

    it('should return all production data if no filter is provided', () => {
        const mockData: ProductionData[] = [
            { state: 'Running', good: 10, reject: 2, duration: 3600 },
            { state: 'Stopped', good: 0, reject: 0, duration: 0 },
        ];

        const urlParams = new URLSearchParams('');
        const stateFilter = urlParams.get('state');

        const summary = productionReport(mockData, { state: stateFilter || undefined });

        expect(summary).toEqual({
            Running: { good: 10, reject: 2, duration: 3600 },
            Stopped: { good: 0, reject: 0, duration: 0 },
        });
    });

    it('should handle invalid URL parameters gracefully', () => {
        const mockData: ProductionData[] = [
            { state: 'Running', good: 10, reject: 2, duration: 3600 },
            { state: 'Stopped', good: 0, reject: 0, duration: 0 },
        ];

        const urlParams = new URLSearchParams('?state=InvalidState');
        const stateFilter = urlParams.get('state');

        const summary = productionReport(mockData, { state: stateFilter || undefined });

        expect(summary).toEqual({});
    });

    it('should handle multiple parameters in the URL gracefully', () => {
        const mockData: ProductionData[] = [
            { state: 'Running', good: 10, reject: 2, duration: 3600 },
            { state: 'Stopped', good: 0, reject: 0, duration: 0 },
        ];

        const urlParams = new URLSearchParams('?state=Running&extraParam=test');
        const stateFilter = urlParams.get('state');

        const summary = productionReport(mockData, { state: stateFilter || undefined });

        expect(summary).toEqual({
            Running: { good: 10, reject: 2, duration: 3600 },
        });
    });
});




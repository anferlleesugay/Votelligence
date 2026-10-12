import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import api from '../api/axios';

// Custom hook: loads data from the API and tracks loading and error state.
//   const { data, loading, error } = useFetch('/polls');
// setData lets a page update the data after a create or delete without refetching.
export function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    // Lets us cancel the request if the component unmounts or the URL changes
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(url, { signal: controller.signal });
        setData(response.data);
      } catch (err) {
        if (axios.isCancel(err)) return; // we cancelled it on purpose
        setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();

    // Cleanup: runs before the next effect and when the component unmounts
    return () => controller.abort();
  }, [url, reloadCount]);

  // Bumping the counter re-runs the effect (used by "Try again" buttons)
  const refetch = useCallback(() => setReloadCount((count) => count + 1), []);

  return { data, setData, loading, error, refetch };
}

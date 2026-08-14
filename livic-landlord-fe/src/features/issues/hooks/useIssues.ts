import { useState, useEffect, useCallback, useMemo } from 'react';
import { getIssues, IssueResponse } from '../api/issues.api';

export function useIssues(token: string | null) {
  const [issues, setIssues] = useState<IssueResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const fetchIssues = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await getIssues(token, page, 20);
      setIssues(data.content || []);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to load issues');
    } finally {
      setIsLoading(false);
    }
  }, [token, page]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  // Clientside filtering & search on fetched page for immediate responsive feedback
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      // 1. Search Query Match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const ticketNum = (issue.ticketNumber || '').toLowerCase();
        const title = (issue.title || '').toLowerCase();
        const desc = (issue.description || '').toLowerCase();
        
        const matchesSearch = ticketNum.includes(q) || title.includes(q) || desc.includes(q);
        if (!matchesSearch) return false;
      }

      // 2. Status Match
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'ESCALATED') {
          if (issue.escalationStatus !== 'ESCALATED') return false;
        } else if (issue.status !== statusFilter) {
          return false;
        }
      }

      // 3. Priority Match
      if (priorityFilter !== 'ALL' && issue.priority !== priorityFilter) {
        return false;
      }

      // 4. Category Match
      if (categoryFilter !== 'ALL' && issue.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [issues, searchQuery, statusFilter, priorityFilter, categoryFilter]);

  // Summary counts for metrics dashboard
  const metrics = useMemo(() => {
    const total = issues.length;
    const open = issues.filter(i => i.status === 'OPEN').length;
    const inProgress = issues.filter(i => i.status === 'IN_PROGRESS').length;
    const escalated = issues.filter(i => i.escalationStatus === 'ESCALATED').length;
    const resolved = issues.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length;

    return { total, open, inProgress, escalated, resolved };
  }, [issues]);

  return {
    issues: filteredIssues,
    rawIssues: issues,
    isLoading,
    error,
    page,
    setPage,
    totalPages,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    categoryFilter,
    setCategoryFilter,
    metrics,
    refresh: fetchIssues
  };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';

export interface Review {
  id: string;
  reviewer_id: string;
  reviewed_id: string;
  contract_id?: string;
  rating: number;
  comment?: string;
  created_at: string;
  reviewer_name?: string;
}

interface ProfileReviewsData {
  reviews: Review[];
  averageRating: number;
  totalCount: number;
}

/*
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL,
  reviewed_id uuid NOT NULL,
  contract_id uuid,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp NOT NULL DEFAULT now(),
  UNIQUE(reviewer_id, contract_id)
);
CREATE INDEX reviews_reviewed_idx ON reviews(reviewed_id);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see all reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users write own reviews" ON reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid()::uuid);
*/

export function useProfileReviews(profileId: string) {
  return useQuery<ProfileReviewsData>({
    queryKey: ['reviews', profileId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*, reviewer:profiles!reviewer_id(name)')
          .eq('reviewed_id', profileId)
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Reviews table might not exist:', error);
          return { reviews: [], averageRating: 0, totalCount: 0 };
        }

        const reviews = data || [];
        const totalCount = reviews.length;
        const averageRating = totalCount > 0 
          ? reviews.reduce((acc, r) => acc + r.rating, 0) / totalCount 
          : 0;

        return {
          reviews: reviews.map(r => ({
            ...r,
            reviewer_name: r.reviewer?.name || 'Usuario',
          })),
          averageRating,
          totalCount
        };
      } catch (err) {
        console.warn('Error fetching reviews:', err);
        return { reviews: [], averageRating: 0, totalCount: 0 };
      }
    },
    enabled: !!profileId
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { reviewer_id: string; reviewed_id: string; contract_id?: string; rating: number; comment?: string }) => {
      const { data, error } = await supabase
        .from('reviews')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.reviewed_id] });
    }
  });
}

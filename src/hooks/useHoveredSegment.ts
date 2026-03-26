import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { setHoveredSegmentId, setHoveredKmDist } from '../store/uiSlice';

export const useHoveredSegment = () => {
  const dispatch = useDispatch<AppDispatch>();
  const hoveredId    = useSelector((s: RootState) => s.ui.hoveredSegmentId);
  const hoveredKmDist = useSelector((s: RootState) => s.ui.hoveredKmDist);

  return {
    hoveredId,
    setHoveredId:     (id: number | null)   => dispatch(setHoveredSegmentId(id)),
    hoveredKmDist,
    setHoveredKmDist: (dist: number | null) => dispatch(setHoveredKmDist(dist)),
  };
};

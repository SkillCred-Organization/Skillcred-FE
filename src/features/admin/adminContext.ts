import { useOutletContext } from 'react-router-dom'
import type { InstitutionResponse } from '../../lib/admin'
export type AdminContext = InstitutionResponse & { reloadInstitution: () => void }
export function useInstitution() { return useOutletContext<AdminContext>() }

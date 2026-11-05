import type { ComponentProps } from 'react'
import { useAuth } from '../../features/auth/authContext'
import { useAvatarUrl } from '../../lib/avatarStore'
import Avatar from './Avatar'

type Props = { initials: string; size?: ComponentProps<typeof Avatar>['size'] }

// Shows the learner's uploaded photo, or their initials if they have none
export default function UserAvatar({ initials, size }: Props) {
  const { user } = useAuth()
  const url = useAvatarUrl(user?.id)
  if (!url) return <Avatar initials={initials} size={size} />
  const px = size === 'lg' ? 56 : 40 // match your Avatar sizes if they differ
  return (
    <img
      src={url}
      alt=""
      width={px}
      height={px}
      referrerPolicy="no-referrer"
      style={{ width: px, height: px, minWidth: px, flexShrink: 0, display: 'block', borderRadius: '50%', objectFit: 'cover' }}
    />
  )
}
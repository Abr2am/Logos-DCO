import { signOut } from '@/lib/auth/actions';

/*
 * Déconnexion.
 *
 * Portée par un formulaire et une Server Action : la déconnexion est une
 * écriture, elle ne doit pas être déclenchable par une simple navigation.
 */
export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="rounded-control border border-line-field px-16 py-[8px] text-[13.5px] font-medium transition-colors duration-[150ms] ease-logos hover:bg-cover-plate focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-walnut-900"
      >
        Se déconnecter
      </button>
    </form>
  );
}

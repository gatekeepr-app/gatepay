-- Allow workspace managers (admin + super_admin) to manage invitations
DROP POLICY IF EXISTS "super admin manage invitations" ON public.invitations;

CREATE POLICY "managers manage invitations"
ON public.invitations
FOR ALL
TO authenticated
USING (public.is_workspace_manager(auth.uid()))
WITH CHECK (public.is_workspace_manager(auth.uid()));
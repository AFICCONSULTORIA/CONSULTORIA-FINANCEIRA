-- Cria o bucket tax-documents (se não existir)
insert into storage.buckets (id, name, public)
values ('tax-documents', 'tax-documents', true)
on conflict (id) do nothing;



-- Política: Usuários autenticados podem fazer upload de arquivos em sua própria pasta
create policy "Users can upload tax documents to their own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'tax-documents' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política: Usuários autenticados podem atualizar (sobrescrever) seus próprios arquivos
create policy "Users can update their own tax documents"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'tax-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política: Usuários autenticados podem deletar seus próprios arquivos
create policy "Users can delete their own tax documents"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'tax-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política: Usuários autenticados podem listar/ver seus próprios arquivos
create policy "Users can view their own tax documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'tax-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

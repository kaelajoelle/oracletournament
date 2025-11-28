begin;

delete from public.sessions
where title like 'Session %';

commit;

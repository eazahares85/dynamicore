CREATE USER dynamicore WITH PASSWORD 'dynamicore';
CREATE DATABASE dynamicore_payments OWNER dynamicore;

\connect dynamicore_payments

\i init.sql

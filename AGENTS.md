# Project conventions

Estimated reading time: 1 minute (150 WPM)

- When the user asks for a **dummy implementation**, create an empty implementation: method bodies are empty or return minimal type-compatible placeholder values. Do not add real behavior or state unless requested.
- Do not write or modify tests unless the user explicitly asks for them.

## Table and model design

- For each database table, provide a corresponding collection class, such as `Tickets`, and a row model, such as `TicketModel`, for each row.
- The collection exposes create, read, update, and delete operations for individual rows. Delegate persistence to the row models; keep database and SQL details abstracted away from the collection.
- Each row model owns changes to its state and directly updates the database and other resources necessary to reflect that state. Keep this resource handling inside the model, not the collection.

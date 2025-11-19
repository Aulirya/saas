-- Define the lessons table
DEFINE TABLE lessons PERMISSIONS none;
-- mandatory
DEFINE FIELD subject_id ON TABLE lessons TYPE record<subjects>;
DEFINE FIELD user_id ON TABLE lessons TYPE record<users>;
DEFINE FIELD description ON TABLE lessons TYPE string;

DEFINE FIELD comments ON TABLE lessons TYPE array<object>;
-- DEFINE comment OBJECT
DEFINE FIELD comments.*.title        ON TABLE lessons TYPE option<string>;
DEFINE FIELD comments.*.description  ON TABLE lessons TYPE string;
DEFINE FIELD comments.*.created_at   ON TABLE lessons TYPE datetime VALUE time::now();
DEFINE FIELD comments.*.updated_at   ON TABLE lessons TYPE datetime VALUE time::now();

-- not mandatory
DEFINE FIELD label ON TABLE lessons TYPE option<string>;
DEFINE FIELD start_at ON TABLE lessons TYPE option<datetime>;
DEFINE FIELD end_at ON TABLE lessons TYPE option<datetime>;

-- system value
DEFINE FIELD created_at ON TABLE lessons TYPE datetime VALUE time::now();
DEFINE FIELD updated_at ON TABLE lessons TYPE datetime VALUE time::now();



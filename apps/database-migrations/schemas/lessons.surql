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

-- mandatory
DEFINE FIELD label ON TABLE lessons TYPE string;

-- not mandatory
DEFINE FIELD duration ON TABLE lessons TYPE number DEFAULT 60;
DEFINE FIELD order   ON TABLE lessons TYPE option<number>;

-- status and scope
DEFINE FIELD status ON TABLE lessons TYPE option<string>;
DEFINE FIELD scope ON TABLE lessons TYPE option<string>;

-- system value
DEFINE FIELD created_at ON TABLE lessons TYPE datetime VALUE time::now();
DEFINE FIELD updated_at ON TABLE lessons TYPE datetime VALUE time::now();



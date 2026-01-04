grammar TripDSL

entry Model:
    (elements+=(Trip | Comment))*;

Trip:
    'trip' '(' properties+=Property (',' properties+=Property)* ')';

Property:
    NameProperty | StopsProperty | FromProperty | ToProperty |
    TagsProperty | ColorProperty;

NameProperty:
    'name' '=' value=STRING;

StopsProperty:
    'stops' '=' '[' stops+=STRING (',' stops+=STRING)* ']';

FromProperty:
    'from' '=' date=STRING;

ToProperty:
    'to' '=' date=STRING;

TagsProperty:
    'tags' '=' '[' tags+=STRING (',' tags+=STRING)* ']';

ColorProperty:
    'color' '=' value=STRING;

Comment:
    value=COMMENT;

hidden terminal WS: /\s+/;
terminal COMMENT: /\/\/[^\n\r]*/;
terminal STRING: /"[^"]*"/;

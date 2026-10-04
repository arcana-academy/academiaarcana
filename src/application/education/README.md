# education

Application orchestration for the P1 educational core.

The application layer coordinates the Education, Learning and Adaptive domain
contracts without exposing persistence details to the UI.

Current use cases:
- assemble the educational overview from persisted practice evidence;
- create native retrieval-practice activities;
- normalize explicit retrieval outcomes into transparent feedback evidence.

Persistence stays behind repository contracts in infrastructure. Gamification
metrics such as XP and streak remain separate from educational mastery evidence.

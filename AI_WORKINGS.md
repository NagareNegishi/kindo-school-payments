# AI workings

## Tools used and what for

1. **Claude in the browser (Opus 5.5, high effort)** for planning. I gave it the requirements, my stack and my data model idea, and we settled the data model, key functions and expected behaviour in chat. It wrote the plan draft, with my own scope split (must have / nice to have / out of scope). I moved some of the brief's nice-to-haves, like responsive design and unit tests, into must have, since my setup made them cheap. I also used it to convert the brief to Markdown and to pull the legacy payment code out of it into a `.py` file.
2. **[project-seed](https://github.com/NagareNegishi/project-seed)**, a sandbox I set up for Claude Code. It holds skills, agents, hooks, scripts, the permission config, a firewall allowlist, rules for how docs and plans get recorded, project setup instructions, stack setup examples from past projects, and reusable functions and components. I used it to start this project quickly under a workflow I had already worked out.
3. **Claude Code (Sonnet 5.5, medium effort)** in manual and auto mode, for project setup, code, tests and documentation.
   - **Setup:** I gave it the plan from the browser and the setup instructions from project-seed, and checked and directed the setup myself.
   - **Planning:** after the dev container was rebuilt, I used project-seed's planning skill to turn the plan into a detailed implementation plan with defined steps.
   - **Building:** one step at a time in manual mode. It wrote the code, and I reviewed it and fixed things or gave direction.
   - **Polish and docs:** once the must haves were covered, I polished the frontend UI through chat. It wrote the documentation from my input to track project state. Auto mode was used for this part.
4. **Claude Code (Sonnet 5.5, medium effort) in a local copy of the repo**, as an experiment. After the initial setup I made a copy and ran the `build-orchestration` skill on it. I gave it the starting instructions and did not review its work. The skill makes the agents write black-box tests first and white-box tests later, and I hoped that would produce more test cases. Once my own reviewed implementation was done, I had Claude compare the two and pull the good test cases into this repo.


## Key prompts

Prompts I use often are saved as skills (in `.claude/skills/`). These are the ones I used most on this project:

- `session-start`: read the session baton, restate the goal and the next task, and open the docs it lists.
- `session-end`: write the baton for the next session, with a short summary, the goal and the single next task.
- `read`: before a task, read every relevant doc and source file in full, then say what was read.
- `plan-product`: turn an idea into a product plan (the what and why).
- `plan-impl`: turn a product plan into a rough implementation plan with build steps.
- `plan-verify`: expand each step of the implementation plan and back it with proof.


## Agent config files

All in the repository:

- `CLAUDE.md`: project rules. Read the plan first, no features outside the plan, commit after each working step, never store a full card number, expiry or CVV.
- `.claude/settings.json`: permissions and hook wiring.
- `.claude/hooks/`: guards that blocked the AI from reading or writing `.env` files, running throwaway probe scripts, adding itself as a commit co-author, and writing to git.
- `.claude/rules/backend.md` and `.claude/rules/frontend.md`: rules per area (adapter only, `run_in_threadpool`, one error shape, mobile-first, mirror backend validation).
- `.devcontainer/project-firewall.sh`: the firewall allowlist for the dev container.

## Where the AI went wrong

In the initial plan, Claude treated "register their child for the trip" as one long flow. A single register endpoint created the child internally, and one frontend component did the same. It met the requirement, but it broke single responsibility and would be harder to test and extend. I noticed this while reviewing its proposal, and told it to split child creation from trip registration, in both backend and frontend.

Claude also wrote duplicated code and re-implemented the same logic in several places. I saw it while reviewing the code at each write-permission prompt, and I expected it. With a 4 hour limit I ignored it on purpose, because I wanted a working prototype fast and every small fix or refactor cost time. Once the prototype worked, I had it list where the code could be simplified, then applied the items one by one, using my own judgement on each.


## What I wrote, rewrote or rejected

I wrote no code myself. I rejected output and directed fixes. Two examples:

- **Long functions:** Claude from time to time put the whole flow in one long function, for example in `backend/app/services/payment.py`. I rejected that and had it split the function into smaller helpers, so each step can be read and tested on its own.
- **One file for all models:** Claude put every model in one file, `backend/app/models/base.py`. I rejected that and had it separate them into one file per model (`parent.py`, `student.py`, `registration.py` and so on), with `base.py` holding only the shared base.

import Players from './pages/Players';
import Teams from './pages/Teams';
import Assessments from './pages/Assessments';
import TeamDashboard from './pages/TeamDashboard';
import ClubManagement from './pages/ClubManagement';
import CoachManagement from './pages/CoachManagement';
import UserManagement from './pages/UserManagement';
import CoachDashboard from './pages/CoachDashboard';
import Tryouts from './pages/Tryouts';
import EvaluationsNew from './pages/EvaluationsNew';
import FormationView from './pages/FormationView';
import PlayerDashboard from './pages/PlayerDashboard';
import PlayerComparison from './pages/PlayerComparison';
import Analytics from './pages/Analytics';
import AdminDataManagement from './pages/AdminDataManagement';
import PlayerRoleAssignment from './pages/PlayerRoleAssignment';
import ClubSettingsAdmin from './pages/ClubSettingsAdmin';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Players": Players,
    "Teams": Teams,
    "Assessments": Assessments,
    "TeamDashboard": TeamDashboard,
    "ClubManagement": ClubManagement,
    "CoachManagement": CoachManagement,
    "UserManagement": UserManagement,
    "CoachDashboard": CoachDashboard,
    "Tryouts": Tryouts,
    "EvaluationsNew": EvaluationsNew,
    "FormationView": FormationView,
    "PlayerDashboard": PlayerDashboard,
    "PlayerComparison": PlayerComparison,
    "Analytics": Analytics,
    "AdminDataManagement": AdminDataManagement,
    "PlayerRoleAssignment": PlayerRoleAssignment,
    "ClubSettingsAdmin": ClubSettingsAdmin,
}

export const pagesConfig = {
    mainPage: "Tryouts",
    Pages: PAGES,
    Layout: __Layout,
};
import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import PlayerProfile from './pages/PlayerProfile';
import BookSession from './pages/BookSession';
import Teams from './pages/Teams';
import Evaluations from './pages/Evaluations';
import Assessments from './pages/Assessments';
import TeamDashboard from './pages/TeamDashboard';
import ClubManagement from './pages/ClubManagement';
import TrainingPlans from './pages/TrainingPlans';
import TrainingPlanDetail from './pages/TrainingPlanDetail';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Players": Players,
    "PlayerProfile": PlayerProfile,
    "BookSession": BookSession,
    "Teams": Teams,
    "Evaluations": Evaluations,
    "Assessments": Assessments,
    "TeamDashboard": TeamDashboard,
    "ClubManagement": ClubManagement,
    "TrainingPlans": TrainingPlans,
    "TrainingPlanDetail": TrainingPlanDetail,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
import React from 'react';
import { useSelector } from 'react-redux';

function Can({ roles = [], children, fallback = null }) {
    const user = useSelector((state) => state.auth?.user);
    const userRoles = user?.roles || [];

    if (roles.length === 0) {
        return <>{children}</>;
    }

    const hasPermission = userRoles.some((userRole) =>
        roles.includes(userRole.nombre?.toLowerCase() || userRole)
    );

    if (hasPermission) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
}

export default Can;
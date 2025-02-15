"use strict"

import * as Cm from './cmapi.js'
import * as V from './vistas.js'
import * as E from './eventos.js'
import * as U from './util.js'

/**
 * Para las prácticas de IU, pon aquí (o en otros js externos incluidos desde tus .htmls) el código
 * necesario para añadir comportamientos a tus páginas.
 * 
 * Este fichero actúa como el pegamento que junta todo. En particular
 * - conecta con el backend (o bueno, al menos lo simular), a través de cmapi.js
 * - genera vistas (usando vistas.js)
 * - asocia comportamientos a las vistas (con ayuda de eventos.js)
 * 
 * Fuera de las prácticas, lee la licencia: dice lo que puedes hacer con él:
 * lo que quieras siempre y cuando
 * - no digas que eres el autor original
 * - no me eches la culpa si algo no funciona como esperas
 *
 * @Author manuel.freire@fdi.ucm.es
 */

// Algunos emoticonos que puede resultar útiles: 🔍 ✏️ 🗑️ ➕ 🧑‍🏫 🧑‍🔧 👥 🎓

//
// Función que refresca toda la interfaz. Debería llamarse tras cada operación
//
function update() {
    try {
        // vaciamos los contenedores
        U.clean("#users");
        U.clean("#courses");

        // y los volvemos a rellenar con su nuevo contenido
        U.add("#courses", V.createCoursesTable(Cm.getCourses()));
        U.add("#users", V.createUserTable(Cm.getUsers()));

        // y añadimos manejadores para los eventos de los elementos recién creados

        E.bindRmCourseRow("#courses button.rm-fila")
        E.bindRmUserRow("#users button.rm-fila")

        E.bindAddEditionToCourse(".add-edition", () => update())

        E.bindDetails("#courses .edition-link", "#details",
            (id) => V.createDetailsForEdition(Cm.resolve(id)),
            (id) => {
                const edition = Cm.resolve(id);
                E.bindRmEditionDetails(".rm-edition", update);
                E.bindAddUserToEdition(".add-profesor-to-edition",
                    "#cmModal .modal-title", "#cmEditForm", "#cmAcceptModal", () => modalEdit,
                    () => `Añadiendo profesor a <i>${edition.name}</i>`,
                    () => V.prepareAddUserToEditionModal(edition, Cm.UserRole.TEACHER),
                    () => U.one(`#d${id}`).click());
                E.bindAddUserToEdition(".add-alumno-to-edition",
                    "#cmModal .modal-title", "#cmEditForm", "#cmAcceptModal", () => modalEdit,
                    () => `Añadiendo alumno a <i>${edition.name}</i>`,
                    () => V.prepareAddUserToEditionModal(edition, Cm.UserRole.STUDENT),
                    () => U.one(`#d${id}`).click());
                update();
            });
        E.bindDetails("#users .edition-link", '#details',
            (id) => V.createDetailsForUser(Cm.resolve(id)),
            (id) => {
                E.bindSetResults(".set-result", () => U.one(`#d${id}`).click());
                update();
            }
        )
        E.bindRmFromEdition(".rm-from-edition", () => update());

        E.bindAddOrEditUser(".add-user,.set-user",
            "#cmModal .modal-title", "#cmEditForm", "#cmAcceptModal", () => modalEdit,
            (user) => user ? `Editando <i>${user.name}</i>` : "Añadiendo usuario",
            (user) => V.prepareAddOrEditUserModal(user),
            () => update());
        E.bindAddOrEditCourse(".add-course,.set-course",
            "#cmModal .modal-title", "#cmEditForm", "#cmAcceptModal", () => modalEdit,
            (course) => course ? `Editando <i>${course.name}</i>` : "Añadiendo curso",
            (course) => V.prepareAddOrEditCourseModal(course),
            () => update());

        E.bindSearch("#search-in-users-input", ".user-table-row");
        E.bindSearch("#search-in-courses-input", ".course-table-row");
        E.bindSearch("#search-in-teachers-input", ".teacher-table-row");
        E.bindSearch("#search-in-students-input", ".student-table-row");
        E.bindSearch("#search-in-user-editions-input", ".user-edition-table-row");

        E.bindSortColumn("tr>th");

        E.bindCheckboxColumn("#users", "cambioSelUsuarios", update);

        const comparator_substring = (field, filter) => field.indexOf(filter) != -1
        const comparator_eq = (field, filter) => field == filter
        const comparator_ignore = () => true


        try {
            E.alternaBusquedaAvanzada("#search-advanced-toggle-courses", "#search-in-courses-input", "#filter-in-courses")
            E.bindFiltroAvanzado("#filter-in-courses", ".course-table-row", [
                {
                    selector: "input[name=coursename]", comparator: comparator_substring
                }, {
                    selector: "select[name=coursearea]", comparator: comparator_eq
                }, {
                    selector: "select[name=courselevel]", comparator: comparator_eq
                }, {
                    selector: "select[name=courseyear]", comparator: comparator_substring
                }
            ])
        } catch (e) { }
        try {
            E.alternaBusquedaAvanzada("#search-advanced-toggle", "#search-in-users-input", "#filter-in-users")
            E.bindFiltroAvanzado("#filter-in-users", ".user-table-row", [
                { selector: "input[name=name]", comparator: comparator_ignore },
                {
                    selector: "input[name=name]", comparator: comparator_substring
                }, {
                    selector: "select[name=role]", comparator: comparator_eq
                }, {
                    selector: "input[name=email]", comparator: comparator_substring
                }, {
                    selector: "input[name=dni]", comparator: comparator_substring
                }
            ])
        } catch (e) { }
        try {
            E.alternaBusquedaAvanzada("#search-advanced-toggle_alumno", "#search-in-students-input", "#filter-in-students")
            E.bindFiltroAvanzado("#filter-in-students", ".student-table-row", [
                {
                    selector: "input[name=name_alumno]", comparator: comparator_substring
                }, {
                    selector: "input[name=email_alumno]", comparator: comparator_substring
                }, {
                    selector: "input[name=dni_alumno]", comparator: comparator_substring
                }, {
                    selector: "input[name=grade_alumno]", comparator: comparator_eq
                }
            ])
        } catch (e) { }

    } catch (e) {
        console.log('Error actualizando', e);
    }
}

// asociamos botones de prueba para GUARDAR y RESTAURAR estado
U.one("#save").addEventListener('click', () => {
    let t = new Date()
    Cm.saveState("estado guardado por el usuario a las " + t.getHours() + ":" + t.getMinutes() + ":" + t.getSeconds())
});


U.one("#clean").addEventListener('click', () => localStorage.clear());

let toast_hide_timeout;
U.one("#restore").addEventListener('click', async () => {
    if (!await U.custom_confirm("¿Quieres desacer hasta el " + Cm.last_state_metadata().msg + "?", true, "Los cambios hechos desde entonces serán sobreescritos")) return
    let metadata = Cm.restoreState();
    if (metadata.msg) {

        document.getElementById("undo_msg").innerText = "restaurado el " + metadata.msg;
        let t = new Date(metadata.time);
        document.getElementById("undo_time").innerText = "hora: " + t.getHours() + ":" + t.getMinutes() + ":" + t.getSeconds();

        let toast = (new bootstrap.Toast(document.querySelectorAll('#undo_toast')[0]))
        toast.show()
        clearTimeout(toast_hide_timeout);
        toast_hide_timeout = setTimeout(() => {
            toast.hide()
        }, 5000)

    }

    console.log("ahora saldría un toast con este metadata:", metadata);
    update();
});

//
// Código que se ejecuta al lanzar la aplicación. 
// No pongas código de este tipo en ningún otro sitio
//
const modalEdit = new bootstrap.Modal(document.querySelector('#cmModal'));

Cm.init()
update()
Cm.saveState("estado inicial");
// cosas que exponemos para poder usarlas desde la consola
window.update = update;
window.Cm = Cm;
window.V = V;
window.E = E;
window.U = U;
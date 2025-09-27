import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router';
import { useLocation } from 'react-router-dom';
import { Container, Modal, Button } from 'react-bootstrap';
import { OrbitProgress } from "react-loading-indicators";
import NavigationBar from '../../components/navigationbar';
import { 
    Label,
    Input,
    Select,
    Submit,
} from "./style"
import { Client } from '../../api/client';
// import UserContext from '../../contexts/UserContext'
import { getPermissions } from '../../service/PermissionService';
import { getDataUser } from '../../service/UserService';

export default function Edit() {

    const location = useLocation();
    const aluno = location.state?.item;
    
    const [name, setName] = useState(aluno.nome)
    const [load, setLoad] = useState(true)
    const [course, setCourse] = useState(aluno.curso_id)
    const [data, setData] = useState([])
    const [show, setShow] = useState(false);
    const navigate = useNavigate();
    // const { user } = useContext(UserContext);
    const permissions = getPermissions()
    const dataUser  = getDataUser()

    function fetchData() {
    
        setLoad(true) 
        setTimeout(() => {
    
            Client.get('alunos/create').then(res => {
                const cursos = res.data
                console.log(cursos)
                setData(cursos.data)
            })
            .catch(function(error) {
                console.log(error)
            })
            .finally( () => {
                setLoad(false)
            })

        }, 1000)
    }

    function updateAluno() {

        const upAluno = { nome: name, curso_id: course }
        
        Client.put("alunos/" + aluno.id, upAluno).then(response => {
            setShow(true);
        })
        .catch(error => {
            console.error(error);
        });
    }

    const handleClose = () => {
        setShow(false)
        navigate('/alunos')
    }

    function verifyPermission() {
        // Não Autenticado   
        if(!dataUser) navigate('/login')
        // Não Autorizado (rota anterior)
        else if(permissions.editAluno === 0) navigate(-1)
    }
    
    useEffect(() => {
        verifyPermission()
        fetchData()
    }, []);

    return (
        <>
            <NavigationBar />
            {
                load 
                ?
                    <Container className="d-flex justify-content-center mt-5">
                        <OrbitProgress variant="spokes" color="#32cd32" size="medium" text="" textColor="" />
                    </Container>
                :
                <Container className='mt-2'>
                    <Label>Nome</Label>
                    <Input
                        type="text" 
                        id="name" 
                        name="name" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <Label>Curso</Label>
                    <Select name="course" id="course" onChange={(e) => setCourse(e.target.value)}>
                        {
                            data.map((element, index) => (
                                element.id == aluno.curso_id
                                ?
                                    <option key={index} value={element.id} selected>
                                        {element.nome}
                                    </option>
                                :
                                    <option key={index} value={element.id}>
                                        {element.nome}
                                    </option>
                            ))
                        }
                    </Select>

                    <Submit value="Voltar" onClick={() => navigate('/alunos')  }/>
                    <Submit value="Alterar" onClick={() => updateAluno() }/>
                </Container>
            }
            <Modal
                show={show}
                onHide={handleClose}
                backdrop="static"
                keyboard={false}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Atualização - Usuário</Modal.Title>
                </Modal.Header>
                <Modal.Body>Operação Efetuda com Sucesso!!</Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={handleClose}>OK</Button>
                </Modal.Footer>
            </Modal>
            
        </>

    )
    
}
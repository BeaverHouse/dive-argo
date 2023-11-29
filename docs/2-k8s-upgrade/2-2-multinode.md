---
sidebar_position: 1
---

# Multi-node 클러스터 생성하기

현재 이미 우리는 `k3s-master` 노드를 만든 상태입니다.  
이 `k3s-master` 노드를 Master node로 하여, 2개의 Worker node를 추가로 구성하여 Multi-node 클러스터를 구축해 보겠습니다.

## Master node의 토큰 확인하기

```
multipass shell k3s-master
```

token 확인[^1]

```
sudo cat /var/lib/rancher/k3s/server/node-token
```

token 저장

## Worker node 생성하기

Worker node를 위한 새로운 VM 생성, 접속

```
multipass launch jammy --name k3s-worker-1 --memory 2G --disk 50G --cpus 2

multipass shell k3s-worker-1
```

다음 명령어로 k3s 설치

```
curl -sfL https://get.k3s.io | K3S_URL=https://<master-ip>:6443 \
K3S_TOKEN=<master-node-token> \
INSTALL_K3S_EXEC="--node-name k3s-worker-1"  sh -
```

같은 방식으로 k3s-worker-2 생성
`kubectl get nodes` 쳐서 다음과 같이 나오면 성공

```
NAME           STATUS   ROLES                  AGE     VERSION
k3s-worker-1   Ready    <none>                 3m54s   v1.27.7+k3s2
k3s-worker-2   Ready    <none>                 27s     v1.27.7+k3s2
k3s-master     Ready    control-plane,master   23m     v1.27.7+k3s2
```

[^1]: https://docs.k3s.io/quick-start#install-script
